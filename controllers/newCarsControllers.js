const { getDb } = require("../config/db");

/**
 * Validate and normalize Kenyan / general phone numbers
 */
const validatePhoneNumber = (phone) => {
  if (!phone || typeof phone !== "string") return null;
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");

  // Match 07XXXXXXXX, 01XXXXXXXX, 2547XXXXXXXX, +254..., or general 9-13 digit phone numbers
  const regex = /^(\+?254|0)[17]\d{8}$|^\d{9,13}$/;
  if (!regex.test(cleaned)) {
    return null;
  }
  return cleaned;
};

const handleNewCars = async (req, res) => {
  const { phoneNumber, denomination, serial: requestedSerial, serialNumber } = req.body;

  if (!phoneNumber || !denomination) {
    return res.status(400).json({
      success: false,
      message: "Phone number and denomination are required",
    });
  }

  const normalizedPhone = validatePhoneNumber(phoneNumber);
  if (!normalizedPhone) {
    return res.status(400).json({
      success: false,
      message: "Invalid phone number format. Please provide a valid phone number (e.g. 0712345678 or 254712345678).",
    });
  }

  try {
    const db = getDb();
    const serialsCollection = db.collection("serials");
    const airtimeCollection = db.collection("airtime");

    const denominationValue = String(denomination).trim();
    const targetSerial = (requestedSerial || serialNumber || "").trim();

    // Query for the specific selected serial or any available for denomination
    const query = { denomination: denominationValue };
    if (targetSerial) {
      query.serial = targetSerial;
    }

    // Concurrency-safe: Atomically find and knock out the serial from inventory
    const result = await serialsCollection.findOneAndDelete(query);
    const serialData = result && result.value !== undefined ? result.value : result;

    if (!serialData) {
      if (targetSerial) {
        return res.status(404).json({
          success: false,
          message: `Serial number ${targetSerial} is no longer available in inventory or has already been issued. Please pick another serial.`,
        });
      }
      return res.status(404).json({
        success: false,
        message: `No available serials found in database for denomination Ksh ${denominationValue}. Please upload more serials.`,
      });
    }

    const airtime = {
      serial: serialData.serial,
      denomination: denominationValue,
      phoneNumber: normalizedPhone,
      createdAt: new Date(),
    };

    // Check for duplicate issuance of identical serial & phone combination
    const existingEntry = await airtimeCollection.findOne({
      serial: airtime.serial,
      phoneNumber: airtime.phoneNumber,
    });

    if (existingEntry) {
      // Put serial back in pool if duplicate airtime record exists
      await serialsCollection.insertOne(serialData);
      return res.status(409).json({
        success: false,
        message: "Duplicate record detected for this phone number and serial.",
      });
    }

    // Insert the serial into the airtime collection
    await airtimeCollection.insertOne(airtime);

    res.status(201).json({
      success: true,
      data: airtime,
      message: `Serial ${serialData.serial} successfully assigned to ${normalizedPhone}`,
    });
  } catch (err) {
    console.error("Error processing new airtime entry:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error during serial issuance",
      error: err.message,
    });
  }
};

module.exports = { handleNewCars };

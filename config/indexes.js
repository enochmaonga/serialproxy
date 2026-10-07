let indexesEnsured = false;

/**
 * Ensure performance and integrity indexes for high-speed serial querying and issuance
 * @param {import('mongodb').Db} db
 */
const ensureAllIndexes = async (db) => {
  if (indexesEnsured || !db) return;
  try {
    const serialsCol = db.collection("serials");
    const airtimeCol = db.collection("airtime");

    await Promise.allSettled([
      serialsCol.createIndex({ serial: 1 }, { unique: true }),
      serialsCol.createIndex({ denomination: 1, serial: 1 }),
      serialsCol.createIndex({ denomination: 1 }),
      serialsCol.createIndex({ createdAt: -1 }),
      airtimeCol.createIndex({ serial: 1 }, { unique: true }),
      airtimeCol.createIndex({ phoneNumber: 1 }),
      airtimeCol.createIndex({ denomination: 1 }),
      airtimeCol.createIndex({ createdAt: -1 }),
    ]);

    indexesEnsured = true;
    console.log("⚡ Database indexes verified and ready.");
  } catch (err) {
    console.warn("⚠️ Index verification notice:", err.message);
  }
};

module.exports = { ensureAllIndexes };

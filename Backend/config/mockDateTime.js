let timeOffset = 0; // Time offset in milliseconds (default: 0, real time)

function setMockDateTime(offsetMillis) {
    try {
      if (typeof offsetMillis !== "number" || isNaN(offsetMillis)) {
        throw new Error("Invalid offset. Expected a valid number in milliseconds.");
      }
  
      timeOffset = offsetMillis; // Set offset relative to current time
      console.log(`[MOCK TIME] Offset set: ${timeOffset} ms (New Time: ${getMockDateTime().toISOString()})`);
    } catch (error) {
      console.error("Error setting mock time:", error.message);
    }
  }

function getMockDateTime() {
  return new Date(Date.now() + timeOffset);
}

function getPGMockDateTime(){
    return new Date(Date.now() + timeOffset).toISOString().replace("T", " ").replace("Z", "");
}

function resetMockDateTime() {
  timeOffset = 0;
  console.log("[MOCK TIME] Reset to real-time.");
}

module.exports = {setMockDateTime, resetMockDateTime, getMockDateTime, getPGMockDateTime}   
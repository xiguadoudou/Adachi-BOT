import db from "../../utils/database.js";
function getTrueNameByNikeName(userID, nikename) {
    if (db.containKey("nikename", userID) && db.includes("nikename", userID, "nikename", nikename)) {
        let { character } = db.get("nikename", userID, { nikename });
        return character;
    }
    return nikename;
}

export { getTrueNameByNikeName };
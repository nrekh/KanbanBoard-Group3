const db = require("../database");

const getAllTasks = async (req, res) => {
    try {
        await db.serialize(function() {
            return db.all("SELECT t.*, p.name AS priority FROM tasks AS t JOIN priorities AS p ON t.priority_id = p.id", function(err, rows) {
                if(err){
                    res.send("Error encountered while fetching");
                    return console.error(err.message);
                }
                else {
                    res.send({
                        data: rows,
                    });
                }
            });
        });
    } catch (error) {
    return res.status(401).json({ error: "Could not fetch tasks data" });
  }
};

module.exports = {
    getAllTasks,
}
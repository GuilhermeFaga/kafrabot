const guildsConfig = require("./guildsConfig.json")
const fs = require("fs")

guildsConfig["545690158461222921"].prefix = "%"

fs.writeFile("test.txt", jsonData, function(err) {
    if (err) {
        console.log(err);
    }
});


var a = guildsConfig["545690158461222921"].prefix

console.log(a)
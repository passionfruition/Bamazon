require("dotenv").config();
var keys = require("./keys");
var mysql = require("mysql");
var inquirer = require("inquirer");
const cTable = require("console.table");

var connection = mysql.createConnection({
    host: keys.sql.host,
    port: keys.sql.port,
    user: keys.sql.user,
    password: keys.sql.pass,
    database: keys.sql.name
});

connection.connect(function (err) {
    if (err) throw err;
    menuOptions();
});

function menuOptions() {
    inquirer
        .prompt({
            name: "action",
            type: "list",
            message: "What would you like to do?",
            choices: [
                "View Products for Sale",
                "View Low Inventory",
                "Add to Inventory",
                "Add New Product",
                "exit"
            ]
        })
        .then(function (answer) {
            switch (answer.action) {
                case "View Products for Sale":
                    viewProductsForSale();
                    break;

                case "View Low Inventory":
                    viewLowInventory();
                    break;

                case "Add to Inventory":
                    addToInventory();
                    break;

                case "Add New Product":
                    addNewProduct();
                    break;

                case "exit":
                    connection.end();
                    break;
            }
        });

    function askNext() {
        inquirer
            .prompt({
                name: "confirm",
                type: "confirm",
                message: "Would you like to do something else?"
            })
            .then(function (answer) {
                if (answer.confirm) {
                    menuOptions();
                } else {
                    connection.end();
                }
            })
    }

    function viewProductsForSale() {
        connection.query("SELECT * FROM products", function (err, res) {
            if (err) throw err;
            console.table(res);
            askNext();
        });
    }

    function viewLowInventory() {
        connection.query("SELECT * FROM products HAVING stock_quantity < 100", function (err, res) {
            if (err) throw err;
            console.table(res);
            askNext();
        })
    }

    function addToInventory() {
        connection.query("SELECT * FROM products", function (err, res) {
            if (err) throw err;
            inquirer
                .prompt([
                    {
                        name: "id",
                        type: "input",
                        message: "What is the ID of the product you want to add to?"
                    },
                    {
                        name: "units",
                        type: "input",
                        message: "How many units would you like to add?"
                    }
                ])
                .then(function(answer) {
                    for (var i = 0; i < res.length; i++) {
                        if (res[i].item_id === parseInt(answer.id)) {
                            connection.query(
                                "UPDATE products SET ? WHERE ?", 
                                [
                                    {
                                        stock_quantity: (res[i].stock_quantity += parseInt(answer.units))
                                    },
                                    {
                                        item_id: parseInt(answer.id)
                                    }
                                ],
                                function(err) {
                                    if (err) throw err;
                                }
                            );
                        }
                    }
                    askNext();
                })
        })
    }

    function addNewProduct() {
        connection.query("SELECT * FROM products", function (err, res) {
            if (err) throw err;
            inquirer
                .prompt([
                    {
                        name: "name",
                        type: "input",
                        message: "What is the product you would like to add?"
                    },
                    {
                        name: "department",
                        type: "input",
                        message: "Which department does it belong to?"
                    },
                    {
                        name: "price",
                        type: "input",
                        message: "What is the price of it?"
                    },
                    {
                        name: "stock",
                        type: "input",
                        message: "How much is in stock?"
                    }
                ])
                .then(function(answer) {
                    connection.query(
                        "INSERT INTO products SET ?",
                        {
                            item_id: res.length + 1,
                            product_name: answer.name,
                            department_name: answer.department,
                            price: answer.price || 0,
                            stock_quantity: answer.stock || 0
                        },
                        function(err) {
                            if (err) throw err;
                            console.log(answer.name + "(s) have been added.")
                            askNext();
                        }
                    )
                })
        })
    }
}
const { generateReply } = require("./aiService");

async function test() {
  const message = "Який товар найкращий?";

  const items = [
    { name: "Ліхтар", price: 200, description: "Яскравий ліхтар" },
    { name: "Ніж", price: 150, description: "Туристичний ніж" },
  ];

  const reviews = [
    { username: "Andrii", rating: 5, review_text: "Дуже хороший товар" },
    { username: "Ivan", rating: 4, review_text: "Нормально" },
  ];

  const reply = await generateReply(message, items, reviews);

  console.log("AI reply:", reply);
}

test();

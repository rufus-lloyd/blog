import express from "express";
import bodyParser from "body-parser";
import { MongoClient } from "mongodb";
import path from "path";

const app = express();

app.use(express.static(path.join(__dirname, "/build")));
app.use(bodyParser.json());

const withDB = async (operations, res) => {
  try {
    const client = await MongoClient.connect("mongodb://localhost:27017", {
      useNewUrlParser: true
    });
    const db = client.db("blog");

    await operations(db);

    client.close();
  } catch (error) {
    res.status(500).json({ message: "Error connecting to db", error });
  }
};

app.get("/api/articles/:name", async (request, response) => {
  withDB(async db => {
    const articleName = request.params.name;

    const articleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });
    response.status(200).json(articleInfo);
  }, response);
});

app.post("/api/articles/:name/upvote", async (request, response) => {
  withDB(async db => {
    const articleName = request.params.name;

    const articleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });

    await db.collection("articles").updateOne(
      {
        name: articleName
      },
      { $set: { upvotes: articleInfo.upvotes + 1 } }
    );

    const updatedArticleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });
    response.status(200).json(updatedArticleInfo);
  }, response);
});

app.post("/api/articles/:name/add-comment", async (request, response) => {
  const { username, comment } = request.body;

  withDB(async db => {
    const articleName = request.params.name;

    const articleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });

    await db.collection("articles").updateOne(
      {
        name: articleName
      },
      { $set: { comments: articleInfo.comments.concat({ username, comment }) } }
    );

    const updatedArticleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });
    response.status(200).json(updatedArticleInfo);
  }, response);
});

app.get("*", (request, response) => {
  response.sendFile(path.join(__dirname + "/build/index.html"));
});

app.listen(8000, () => console.log("Listening on port 8000"));

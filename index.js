const express = require("express");
const { PORT } = require("./config/constants");
const loggerMiddleWare = require("morgan");
const cors = require("cors");
const authRouter = require("./routers/auth");
const authMiddleWare = require("./auth/middleware");
const Users = require("./models").user;
const Recipes = require("./models").recipe;
const { toData } = require("./auth/jwt");

const app = new express();

app.use(loggerMiddleWare("dev"));
const bodyParserMiddleWare = express.json();
app.use(bodyParserMiddleWare);

app.use(cors());

app.use("/", authRouter);

app.get("/", (req, res) => {
  res.send("Hi from express");
});

// ./tests TEST
app.post("/authorized_post_request", authMiddleWare, (req, res) => {
  const user = req.user;
  delete user.dataValues["password"];

  res.json({
    youPosted: {
      ...req.body,
    },
    userFoundWithToken: {
      ...user.dataValues,
    },
  });
});

// GET all recipes of a user

app.get("/getrecipes/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const findUser = await Users.findByPk(id);
    const userName = findUser.name;
    const userPic = findUser.profileUrl;
    const recipes = await Recipes.findAll({ where: { userId: findUser.id } });

    return res.status(200).send({ message: "ok", recipes, userName, userPic });
  } catch (error) {
    console.log(error.message);
  }
}),
  // GET all user profiles

  app.get("/profiles", async (req, res) => {
    try {
      const profiles = await Users.findAll({
        attributes: ["name", "profileUrl", "id"],
      });

      return res.status(200).send({ message: "ok", profiles });
    } catch (error) {
      console.log(error.message);
    }
  });

// ADD a recipe to profile

app.post("/addrecipe", async (req, res) => {
  try {
    const { userId, recipeId, recipeName, recipePic } = req.body;

    console.log("body content add rec", userId, recipeId);

    addRecipe = await Recipes.create({
      userId: userId,
      recipeId: recipeId,
      recipeName: recipeName,
      recipePic: recipePic,
    });

    return res.status(201).send({ message: "Recipe added!", addRecipe });
  } catch (error) {
    console.log(error.message);
  }
});

// DELETE a recipe from profile

app.delete("/deleterecipe/:recipe", authMiddleWare, async (req, res) => {
  try {
    const { recipe } = req.params;

    const user = req.user;
    console.log("USER: ", user);

    const userId = req.user.id;
    console.log("userID", userId);
    console.log("recipe id:", recipe);

    // console.log("recipeId to del", userId);
    // parseInt

    const recipeToDelete = await Recipes.findOne({
      where: {
        userId: userId,
        recipeId: recipe,
      },
    });

    console.log("recipe to delete", recipeToDelete);

    if (!recipeToDelete) {
      console.log("loading..");
    } else {
      await recipeToDelete.destroy();
    }

    res.status(200).send({ message: "recipe deleted" });
  } catch (error) {
    console.log(error.message);
  }
});

app.patch("/ratings", authMiddleWare, async (req, res) => {
  try {
    const { id, stars } = req.body;

    const recipe = await Recipes.findByPk(id);
    await recipe.update({ stars });
    return res.send(recipe);
  } catch (error) {
    console.log(error.message);
  }
});

app.listen(PORT, () => {
  console.log(`Listening on port: ${PORT}`);
});

const express = require("express");
const { graphqlHTTP } = require("express-graphql");
const { buildSchema } = require("graphql");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Event = require("./models/events");
const User = require("./models/users");

const app = express();
app.use(express.json());

app.use(
  "/graphql",
  graphqlHTTP({
    schema: buildSchema(`
            type Event {
                _id: ID!
                title: String!
                description: String!
                price: Float!
                date: String! 
            }

            type User {
              _id: ID!
              name: String!
              email: String!
              password: String
            }

            input UserInput {
              name: String!
              email: String!
              password: String!
            }

            input EventInput {
              title: String!
              description: String!
              price: Float!
              date: String!
            }

            type RootQuery {
                events: [Event!]!
                users: [User!]
            }
            type RootMutation {
                createEvent(eventInput: EventInput): Event
                createUser(userInput: UserInput): User
            }

            schema {
                query: RootQuery
                mutation: RootMutation
            }
    `),
    rootValue: {
      events: async () => {
        try {
          const events = await Event.find();
          return events.map((event) => {
            return { ...event._doc, _id: event._doc._id.toString() };
          });
        } catch (err) {
          throw err;
        }
      },

      users: async () => {
        try {
          const users = await User.find();
          return users.map((user) => {
            return { ...user._doc, _id: user._doc._id.toString() };
          });
        } catch (err) {
          throw err;
        }
      },

      createEvent: (args) => {
        const event = new Event({
          title: args.eventInput.title,
          description: args.eventInput.description,
          price: +args.eventInput.price,
          date: new Date(args.eventInput.date),
        });
        return event
          .save()
          .then((result) => {
            return { ...result._doc, _id: result._doc._id.toString() };
          })
          .catch((err) => {
            throw err;
          });
      },

      createUser: async (args) => {
        const checkUser = await User.findOne({ email: args.userInput.email });
        const hashedPassword = await bcrypt.hash(args.userInput.password, 12);

        if (checkUser) {
          throw new Error("User already exists.");
        }

        const user = new User({
          name: args.userInput.name,
          email: args.userInput.email,
          password: hashedPassword,
        });

        return user
          .save()
          .then((result) => {
            return { ...result._doc, _id: result._doc._id.toString() };
          })
          .catch((err) => {
            throw err;
          });
      },
    },
    graphiql: true,
  })
);

const PORT = 3000;

mongoose
  .connect(
    `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.9wh3e.mongodb.net/${process.env.MONGO_DB_NAME}?retryWrites=true&w=majority`
  )
  .then(() => {
    app.listen(3000, () => {
      console.log(`Server is running on PORT ${PORT}`);
    });
  })
  .catch((err) => console.log(err));

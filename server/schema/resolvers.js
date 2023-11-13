const { User } = require("../models");
const { signToken, AuthenticationError } = require("../utils/auth");

const resolvers = {
  Query: {
    // Get a list of users with saved books
    users: async () => User.find().select("-__v -password").populate("savedBooks"),
    
    // Get a single user by username with saved books
    user: async (_, { username }) => User.findOne({ username }).select("-__v -password").populate("savedBooks"),
    
    // Get the current authenticated user with saved books
    me: async (_, __, context) => {
      if (context.user) {
        return User.findOne({ _id: context.user._id }).select("-__v -password").populate("savedBooks");
      }
      throw new AuthenticationError("Authentication required. Please log in!");
    },
  },

  Mutation: {
    // Create a new user
    addUser: async (_, { username, email, password }) => {
      console.log("Data Recieve: ", username, email);
      const newUser = await User.create({ username, email, password });
      console.log("New User: ", newUser)
      const token = signToken(newUser);
      return { token, user: newUser };
    },

    // Log in an existing user
    login: async (_, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user || !(await user.isCorrectPassword(password))) {
        throw new AuthenticationError("Invalid email or password");
      }

      const token = signToken(user);

      return { token, user };
    },

    // Save a book to the authenticated user's collection
    saveBook: async (_, { bookSaved }, context) => {
      if (context.user) {
        const updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $addToSet: { savedBooks: bookSaved } },
          { new: true, runValidators: true }
        ).populate('savedBooks');

        return updatedUser;
      }
      throw new AuthenticationError("Authentication required. Please log in!");
    },

    // Remove a book from the authenticated user's collection
    removeBook: async (_, { bookId }, context) => {
      if (context.user) {
        const updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $pull: { savedBooks: { bookId } } },
          { new: true }
        ).populate('savedBooks');

        return updatedUser;
      }
      throw new AuthenticationError("Authentication required. Please log in!");
    },
  },
};

module.exports = resolvers;

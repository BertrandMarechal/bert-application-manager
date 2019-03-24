import { User } from "./datasources/model";

export default {
    Query: {
        getUsers: async (_, __, { dataSources }) => dataSources.userAPI.getUsers()
    },
    Mutation: {
        createUser: async (_, userData: User, { dataSources }) => dataSources.userAPI.createUser(userData)
    }
};
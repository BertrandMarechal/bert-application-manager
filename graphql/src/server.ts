import { ApolloServer } from 'apollo-server';
import resolvers from './resolvers';
import UserAPI from './datasources/userAPI';
import typeDefs from './schema';
import Store from "./utils/store";

class Server {
    private readonly server;

    constructor() {
        const store = new Store();

        this.server = new ApolloServer({
            typeDefs,
            resolvers,
            dataSources: () => ({
                userAPI: new UserAPI({ store }),
            })
        });
    }

    start() {
        this.server.listen(process.env.PORT || 4000).then(({ url }) => {
            console.log(`🚀 Server ready at ${url}`);
        });
    }
}

const server = new Server();
server.start();
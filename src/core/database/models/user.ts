import sequelize from "sequelize";
import { DatabaseManager } from "../DatabaseManager";

export class User extends sequelize.Model {
    id: string;
    contribution: number;
    static async get(id: string) {
        const [user, _] = await User.findOrCreate({
            where: {
                id: id,
            },
        });
        return user;
    }
}
export function init() {
    User.init(
        {
            id: {
                type: sequelize.DataTypes.STRING,
                unique: true,
                primaryKey: true,
            },
            contribution: {
                type: sequelize.DataTypes.INTEGER,
                defaultValue: 0,
                allowNull: false,
            },
        },
        {
            sequelize: DatabaseManager.sequelize,
        }
    );
}

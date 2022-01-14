import { Model, DataTypes } from "sequelize";
import { DatabaseManager } from "../DatabaseManager";

export class User extends Model {
    id: string;
    contribution: number;
    static async get(id: string) {
        const [user, created] = await User.findOrCreate({
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
                type: DataTypes.STRING,
                unique: true,
                primaryKey: true,
            },
            contribution: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
                allowNull: false,
            },
        },
        {
            sequelize: DatabaseManager.sequelize,
        }
    );
}

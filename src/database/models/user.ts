import sequelize from "sequelize";

export class User extends sequelize.Model {
    declare id: string;
    declare contribution: number;
    static async get(id: string) {
        const [user, _] = await User.findOrCreate({
            where: {
                id: id,
            },
        });
        return user;
    }
}
export function init(instance: sequelize.Sequelize) {
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
            sequelize: instance,
        }
    );
}

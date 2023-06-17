import sequelize from "sequelize";

export class Grab extends sequelize.Model {
    declare id: number;
    declare guild: string;
    declare channel: string;
    declare time: Date;
}

export function init(instance: sequelize.Sequelize) {
    Grab.init(
        {
            guild: {
                type: sequelize.DataTypes.STRING,
                allowNull: false,
            },
            channel: {
                type: sequelize.DataTypes.STRING,
                allowNull: false,
            },
            time: {
                type: sequelize.DataTypes.DATE,
                defaultValue: sequelize.DataTypes.NOW,
                allowNull: false,
            },
        },
        { sequelize: instance }
    );
}

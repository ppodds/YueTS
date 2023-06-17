import sequelize from "sequelize";

export class Reply extends sequelize.Model {
    declare id: number;
    declare dm: boolean;
    declare scope: string;
    declare key: string;
    declare response: string;
    declare formatted: boolean;
    /**
     * Get reply(only response) according parameters
     * @param {String} key reply's key
     * @param {String} scope user id or guild id
     * @param {Boolean} global whether the reply is a global reply
     * @param {Boolean} formated whether the reply is a formatted message
     */
    static async getResponse(
        key: string,
        scope: string | null,
        global: boolean,
        formated: boolean
    ) {
        return await Reply.findOne({
            where: {
                dm: global,
                scope: scope,
                key: key,
                formatted: formated,
            },
            attributes: ["response"],
        });
    }
}

export function init(instance: sequelize.Sequelize) {
    Reply.init(
        {
            dm: {
                type: sequelize.DataTypes.BOOLEAN,
                allowNull: false,
            },
            scope: {
                type: sequelize.DataTypes.STRING,
                allowNull: false,
            },
            key: {
                type: sequelize.DataTypes.STRING,
                allowNull: false,
            },
            response: {
                type: sequelize.DataTypes.STRING(2000),
                allowNull: false,
            },
            formatted: {
                type: sequelize.DataTypes.BOOLEAN,
                allowNull: false,
            },
        },
        { sequelize: instance }
    );
}

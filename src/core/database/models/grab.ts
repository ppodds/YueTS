import { Model, DataTypes } from "sequelize";
import { DatabaseManager } from "../DatabaseManager";

export class Grab extends Model {
    id: number;
    guild: string;
    channel: string;
    time: Date;
}

export function init() {
    Grab.init(
        {
            guild: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            channel: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            time: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
                allowNull: false,
            },
        },
        { sequelize: DatabaseManager.sequelize }
    );
}

module.exports = (sequelize, DataTypes) => {
  const Meeting = sequelize.define("Meeting", {
    googleEventId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    title: { type: DataTypes.STRING, allowNull: false },
    description: DataTypes.TEXT,
    startTime: { type: DataTypes.DATE, allowNull: false },
    endTime: { type: DataTypes.DATE, allowNull: false },
    meetLink: DataTypes.STRING,
    orgId: { type: DataTypes.INTEGER, allowNull: false },
    leadId: DataTypes.INTEGER,
  });

  // ADD THIS SECTION FOR SUGGESTIONS & JOINS
  Meeting.associate = (models) => {
    Meeting.belongsTo(models.Organization, {
      foreignKey: "orgId",
      as: "organization",
      onDelete: "CASCADE"
    });
    Meeting.belongsTo(models.Lead, {
      foreignKey: "leadId",
      as: "lead",
      onDelete: "SET NULL"
    });
  };

  return Meeting;
};

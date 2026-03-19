'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Sops', {
      id: {
        allowNull: false,
        primaryKey: true, // Set as primary key if intended
          autoIncrement: true,
        type: Sequelize.INTEGER
      },
      videoScript: {
        type: Sequelize.TEXT('long') // Use long text if needed
      },
      videoUrl: {
        type: Sequelize.STRING
      },
      videoId : {
         type : Sequelize.STRING
      },
      orgId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Organizations', // Target table name (usually plural)
          key: 'id'               // Target column name
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Sops');
  }
};
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Documents', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      docType: { type: Sequelize.STRING, allowNull: false },
      docUrl: { type: Sequelize.STRING, allowNull: false },
      orgId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Organizations', // Target table
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('Documents');
  }
};

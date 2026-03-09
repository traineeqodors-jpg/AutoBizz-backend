'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Organizations', 'profileImage', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('Organizations', 'profileImage');
  }
};

'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Logic to remove the column
    await queryInterface.removeColumn('OrganizationDetails', 'sop');
  },

  async down(queryInterface, Sequelize) {
    // Logic to reverse the action (add the column back)
    await queryInterface.addColumn('OrganizationDetails', 'sop', {
      type: Sequelize.TEXT, // Specify the original data type
      
      
    });
  }
};

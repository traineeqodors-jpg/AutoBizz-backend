'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('OrganizationDetails', 'startedInYear', {
     
      type: 'INTEGER USING CAST(EXTRACT(YEAR FROM "startedInYear") AS INTEGER)',
      allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
   
    await queryInterface.changeColumn('OrganizationDetails', 'startedInYear', {
      type: 'DATEONLY USING (CAST("startedInYear" || \'-01-01\' AS DATE))',
      allowNull: false
    });
  }
};

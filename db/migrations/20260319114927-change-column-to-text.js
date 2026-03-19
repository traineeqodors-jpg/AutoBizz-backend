'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Leads', 'subject', {
      type: Sequelize.TEXT, // Switches from STRING to TEXT
      allowNull: true       // Matches your existing constraint
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Leads', 'subject', {
      type: Sequelize.STRING, // Reverts back if needed
      allowNull: true
    });
  }
};

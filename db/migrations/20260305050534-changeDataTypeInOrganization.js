'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
 up: async (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('Organizations', 'businessSize', {
      type: Sequelize.STRING, 
     
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    
    return queryInterface.changeColumn('Organizations', 'businessSize', {
      type: Sequelize.INTEGER,
     
    });
  }
};

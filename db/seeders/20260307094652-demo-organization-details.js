'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    
    return queryInterface.bulkInsert('OrganizationDetails', [
      {
        orgId: 11, 
        orgCategory: 'Technology',
        startedInYear: '2015-05-12', // DATEONLY format: YYYY-MM-DD
        description: 'A leading provider of innovative software solutions.',
        businessSummary: 'This is a long business summary describing the company operations and mission in detail.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        orgId: 9,
        orgCategory: 'IT Technology',
        startedInYear: '2020-01-01',
        description: 'Specializing in telemedicine and digital health records.',
        businessSummary: 'Extensive summary regarding medical service outreach and digital transformation.',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
 
    return queryInterface.bulkDelete('OrganizationDetails', null, {});
  }
};

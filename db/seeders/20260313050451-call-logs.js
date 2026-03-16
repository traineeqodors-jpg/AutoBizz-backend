'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('CallLogs', [
      {
        callSid: 'CA' + Math.random().toString(36).substring(7),
        from: '+14155550101',
        to: '+14155550202',
        status: 'completed',
        duration: 45,
        transcript: 'Hello, I am calling regarding my recent Twilio integration setup.', // Added
        orgId: 12, // Added (Assumes Org ID 101 exists)
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        callSid: 'CA' + Math.random().toString(36).substring(7),
        from: '+14155550303',
        to: '+14155550404',
        status: 'no-answer',
        duration: 0,
        transcript: null, 
        orgId: 12,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('CallLogs', null, {});
  }
};

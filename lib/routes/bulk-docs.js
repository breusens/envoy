'use strict';

var express = require('express'),
  router = express.Router(),
  app = require('../../app'),
  access = require('../access'),
  utils = require('../utils'),
  uuid = require('uuid'),
  auth = require('../auth');

var filterReply = function(reply) {
  for (var i in reply) {
    reply[i] = access.strip(reply[i]);
  }
  return reply;
}

// _bulk_docs
router.post('/' + app.dbName + '/_bulk_docs', auth.isAuthenticated, function(req, res) {

  var newEdits = typeof req.body.new_edits === 'undefined' ? true : req.body.new_edits;

  // Iterate through docs, adding uuids when missing and adding owner ids
  var doclist = req.body.docs;
  if (req.body && req.body.docs && req.body.docs.length) {
    doclist = req.body.docs.map(function(doc) {
      if (typeof doc === 'object') {
        if (doc._id) {
          doc._id = access.addOwnerId(doc._id, req.session.user.name);
        } else {
          doc._id = access.addOwnerId(uuid.v4(), req.session.user.name);
        }
      }
      return doc;
    });
  } 
  
  app.db.bulk({docs: doclist, new_edits: newEdits}, function(err, body) {
    if (err) {
      return utils.sendError(err, res);
    }
    res.send(filterReply(body));
  });

});

module.exports = router;

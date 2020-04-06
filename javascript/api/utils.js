module.exports = {
  fixSearchString: function(searchString) {
    searchString = searchString.replace(/[^\x20-\x7E]/g, "");
    searchString = searchString.replace('(', '%7B');
    searchString = searchString.replace(')', '%7D');
    searchString = searchString.replace(' ', '%20');
    searchString = searchString.trim();

    return searchString;
  },

  fixSkipAndLimit: function(reqQuery, callback) {
    var skip = 0;
    var limit = 50;

    if (reqQuery.skip !== undefined) {
      skip = parseInt(reqQuery.skip);
    }

    if (reqQuery.limit !== undefined) {
      limit = parseInt(reqQuery.limit);

      if (limit > 50) {
        limit = 50;
      }
    }

    callback(skip, limit);
  }
};
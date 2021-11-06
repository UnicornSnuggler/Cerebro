const { DocumentStore } = require('ravendb');

exports.CreateDocumentStore = function(database) {
    let options = {
        certificate: Buffer.from(process.env.ravenPem, 'base64'),
        type: 'pem'
    }
    
    return new DocumentStore([process.env.ravenUri], database, options);
}

exports.DeriveDatabase = function(suffix) {
    return `cerebro${suffix}`;
}
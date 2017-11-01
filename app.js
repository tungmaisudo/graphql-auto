var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
import graphqlHTTP from 'express-graphql';//adding graphql API

// var index = require('./routes/index');
// var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// app.use('/', index);
// app.use('/users', users);

app.get('/', (req, res) => {
  res.render("index", {
    title: "Graphql"
  });
});

import {
  GraphQLID,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLList,
  GraphQLString,
  GraphQLInt,
  GraphQLSchema
} from 'graphql';

var rp = require('request-promise');
const queryString = require('query-string');
// import APIInput from './graphql/index';
// const CONFIG = require('./graphql/config');
function getGraphqlType(jsonData, nameType) {
  let objectTarget = {};
  for (let key in jsonData) {
    // console.log(key);
    var data = jsonData[key];
    let typeOfData = typeof data;
    if (typeOfData === 'number' || typeOfData === 'string') {
      objectTarget[key] = {
        type: GraphQLString
      }
    } else if (typeOfData === 'object') {
      if (data instanceof Array) {
        let typeData = getGraphqlType(data[0], key);
        objectTarget[key] = {
          type: new GraphQLList(typeData)
        }
      }
      else {
        let typeData = getGraphqlType(data, key);
        objectTarget[key] = {
          type: typeData
        }

      }
    }
  }
  let typeTarget = new GraphQLObjectType({
    name: nameType,
    fields: () => (objectTarget)
  });
  return typeTarget;
}

// var data = {
//   iUserId: "47",
//   type: "countryList",
//   tSessionId: "fdfd",
//   GeneralMemberId: "47",
//   GeneralUserType: "DRIVER",
//   GeneralDeviceType: "IOS",
//   AppVersion: "1.3",
//   Platform: "IOS",
//   GeneralAppVersion: "1.3",
//   vDeviceType: "IOS",
//   UserType: "DRIVER",
//   vDeviceToken: "2575ffa260614e03d6c215461ab9190ffa535dd5e15a0c208f0e392d36450876"
// }

// var options = {
//   method: 'POST',
//   uri: CONFIG.BASE_URL,
//   body: queryString.stringify(data),
//   headers: {
//     'content-type': 'application/x-www-form-urlencoded'
//   }
// };
// GraphQL API
// https://jsonplaceholder.typicode.com/posts/1
app.use('/graphql', graphqlHTTP((request, response, graphQLParams) => {
  console.log(request.query.api);
  var options = {
    method: 'GET',
    uri: request.query.api,
    // body: queryString.stringify(data),
    headers: {
      'content-type': 'application/x-www-form-urlencoded'
    }
  };
  return rp(options)
    .then(function (parsedBody) {
      var dataResponse = JSON.parse(parsedBody);
      var dataResponseType = getGraphqlType(dataResponse, 'dataResponse');

      var queriesResponse = {
        type: dataResponseType,
        // args: {
        //   data: {
        //     type: new GraphQLNonNull(APIInput)
        //   }
        // },
        resolve(root, params) {
          return rp(options)
            .then(function (parsedBody) {
              return JSON.parse(parsedBody);
            })
            .catch(function (err) {
              console.log(err)
            });
        }

      }
      const objectResponse = {
        queriesResponse: queriesResponse
      }
      const queries = new GraphQLObjectType({
        name: "queries",
        fields: objectResponse
      })

      let schema = new GraphQLSchema({
        query: queries
      });
      return { //Tích hợp vào Express
        schema,
        graphiql: true,//If true, presents GraphiQL when the GraphQL endpoint is loaded in a browser
        pretty: true// If true, any JSON response will be pretty-printed.
      }

    })
}))

app.listen(3000, () => {
  console.log('GraphQL server running at port 3000...')
})

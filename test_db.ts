import dataSource from './datasource';

// TODO make this work
const test_datasource = new dataSource();
test_datasource.sendMessages( [
  {
    _id: 0,
    text: 'test message round 22',
    chatID: 'test',
    user: {
      _id: 69,
      name: 'Adi Bellary'
    }
  }]
)
console.log('sent messages from test');

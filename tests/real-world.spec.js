const { assertEqual } = require("./utils");

describe("complex real-world scenarios", () => {
  it("should format API response-like structure", () => {
    const input =
      '{"status":"success","data":{"users":[{"id":1,"name":"Alice","email":"alice@example.com"},{"id":2,"name":"Bob","email":"bob@example.com"}],"total":2},"timestamp":1634567890}';
    const expected = `{
  "status": "success",
  "data": {
    "users": [
      {
        "id": 1,
        "name": "Alice",
        "email": "alice@example.com"
      },
      {
        "id": 2,
        "name": "Bob",
        "email": "bob@example.com"
      }
    ],
    "total": 2
  },
  "timestamp": 1634567890
}`;
    assertEqual(input, expected);
  });

  it("should format configuration-like structure", () => {
    const input =
      '{"server":{"host":"localhost","port":8080,"ssl":false},"database":{"host":"db.example.com","credentials":{"username":"admin","password":"secret123"}},"features":["auth","logging","caching"]}';
    const expected = `{
  "server": {
    "host": "localhost",
    "port": 8080,
    "ssl": false
  },
  "database": {
    "host": "db.example.com",
    "credentials": {
      "username": "admin",
      "password": "secret123"
    }
  },
  "features": [
    "auth",
    "logging",
    "caching"
  ]
}`;
    assertEqual(input, expected);
  });

  it("should handle array of mixed types", () => {
    const input = '[1,"text",true,null,{"key":"value"},[1,2,3]]';
    const expected = `[
  1,
  "text",
  true,
  null,
  {
    "key": "value"
  },
  [
    1,
    2,
    3
  ]
]`;
    assertEqual(input, expected);
  });
});

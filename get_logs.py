import urllib.request, json

token = 'CU8Rm5A3tCFJPya3CMvcj8XflnWI1lYLrhfQt4G2'

# First introspect Build type fields
q = json.dumps({'query': '{ __type(name: "Build") { fields { name } } }'})
req = urllib.request.Request('https://api.expo.dev/graphql', data=q.encode(),
    headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'})
r = json.loads(urllib.request.urlopen(req).read())
print("Build fields:")
for f in r['data']['__type']['fields']:
    print(" ", f['name'])

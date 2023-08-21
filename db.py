from pymongo import MongoClient
client = MongoClient()

client = MongoClient("mongodb+srv://admin:20100609@djinii.m6adzq4.mongodb.net/?retryWrites=true&w=majority")

db = client['test']  # db이름
collection = db['users']  # 컬렉션 이름
# new_quiz = [
#     {
#         "tag" : "police",
#         "q" : "자전거는 차도보다 인도에서 타는 것이 안전하다",
#         "a" : 0,
#         "difficulty" : "difficult",
#         "point" : 3
#     },
#     {
#         "tag" : "police",
#         "q" : "자전거를 타면서 방향을 바꿀 때는 손으로 방향 지시 신호를 해야 한다",
#         "a" :1,
#         "difficulty" : "difficult",
#         "point" : 3
#     },
#     {
#         "tag" : "police",
#         "q" : "자전거 전용도로가 없으면 차도의 가장 오른쪽 차선을 이용해야 한다",
#         "a" : 1,
#         "difficulty" : "difficult",
#         "point" : 3
#     },
#     {
#         "tag" : "police",
#         "q" : "자전거를 타면서 음악을 들으면 집중력이 높아져 안전하게 운전할수있다",
#         "a" : 0,
#         "difficulty" : "easy",
#         "point" :  2,
#     },
#     {
#         "tag" : "police",
#         "q" : "교통 사고가 발생하면 운전자가 항상 잘못이다",
#         "a" : 0,
#         "difficulty" : "easy",
#         "point":2
#     }
# ]

# collection.insert_many(new_quiz)
collection.delete_many({})  # 전체삭제

# collection.delete_one({'field': 'value'})
# collection.delete_many({'field': 'value'})


var categories = {
    "music": 1,
    "conference":2,
    "learning_education":3,
    "comedy":4,
    "family":5,
    "movies_film": 6,
    "food":7,
    "art":8,
    "fundraisers":9,
    "festivals":10,
    "holiday": 11,
    "support":12,
    "health":13,
    "wellness":14,
    "kids":15,
    "fun":16,
    "books":17,
    "attractions":18,
    "community":19,
    "business": 20,
    "singles_social": 21,
    "schools_alumni" : 22,
    "clubs_associations": 23,
    "outdoors_recreation": 24,
    "performing_arts":25,
    "animals":26,
    "politics":27,
    "sales":28,
    "science":29,
    "religion_spirituality":30,
    "technology":31,
    "sports":32,
    "others":33,
    "misc":34

};

var csvOfCategories = Object.keys(categories).join(",").toLowerCase();
module.exports = {
    categories: categories,
    csvOfCategories: csvOfCategories
};
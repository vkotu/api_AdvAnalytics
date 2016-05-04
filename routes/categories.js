var categories = {
    "music": 1,
    "conference":2,
    "learning_education":3,
    "comedy":4,
    "family":5,
    "movies": 6,
    "movies_film":38,
    "film":37,
    "food":7,
    "fundraisers":9,
    "festivals":10,
    "holiday": 11,
    //"support":12,
    "health":13,
    "wellness":14,
    "kids":15,
    "fun":16,
    "books":17,
    //"attractions":18,
    "community":19,
    "business": 20,
    "singles_social": 21,
    "schools_alumni" : 22,
    "clubs_associations": 23,
    "outdoors_recreation": 24,
    //"animals":26,
    "politics":27,
    "sales":28,
    "science":29,
    "religion_spirituality":30,
    "technology":31,
    "sports":32,
    //"misc":34,
    "family_fun_kids":35,
    "health_wellness":36

};

var csvOfCategories = Object.keys(categories).join(",").toLowerCase();
module.exports = {
    categories: categories,
    csvOfCategories: csvOfCategories
};
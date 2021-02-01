suite('"Index" Page Tests', function() {
    test('page should contain link back to home page', function() {
        assert($('a[href="/"]'));
    })
});
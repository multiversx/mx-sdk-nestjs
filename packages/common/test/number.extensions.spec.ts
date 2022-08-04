import '../src/utils/extensions/number.extensions';

describe('Number Extensions', () => {
  it('toRounded', () => {
    expect(3.1415.toRounded()).toEqual(3);
    expect(3.1415.toRounded(1)).toEqual(3.1);
    expect(3.1415.toRounded(2)).toEqual(3.14);
  });

  it('in', () => {
    expect(Number(3).in(1, 2, 3, 4)).toEqual(true);
    expect(Number(3).in(1, 2, 4)).toEqual(false);
  });
});

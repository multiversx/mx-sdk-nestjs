import '../../src/utils/extensions/date.extensions';

describe('Date Extensions', () => {
  it('getTimeInSeconds', () => {
    expect(new Date(1712051285123).getTimeInSeconds()).toEqual(1712051285);
    expect(new Date(1712051285999).getTimeInSeconds()).toEqual(1712051285);
  });
});

import '../../src/utils/extensions/string.extensions';

describe('String Extensions', () => {
  it('removePrefix', () => {
    expect('helloworld'.removePrefix('hello')).toEqual('world');
    expect('helloworld'.removePrefix('hello2')).toEqual('helloworld');
  });

  it('removeSuffix', () => {
    expect('helloworld'.removeSuffix('world')).toEqual('hello');
    expect('helloworld'.removeSuffix('world2')).toEqual('helloworld');
  });

  it('in', () => {
    expect('hello'.in('hello', 'world')).toEqual(true);
    expect('world'.in('hello', 'world')).toEqual(true);
    expect('world2'.in('hello', 'world')).toEqual(false);
  });
});

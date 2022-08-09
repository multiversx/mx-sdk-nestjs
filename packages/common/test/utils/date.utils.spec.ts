import {DateUtils} from '../../src/utils/date.utils';

describe('Date Utils', () => {
    it('createUTC', () => {
        const date = DateUtils.createUTC(2022, 10, 10, 18, 60, 60, 60);
        expect(new Date(date)).toBeInstanceOf(Date);
    });

    it('create', () => {
      const date = DateUtils.create(2022, 10, 10, 18, 60, 60, 60);
      expect(new Date(date)).toBeInstanceOf(Date);
    });
});

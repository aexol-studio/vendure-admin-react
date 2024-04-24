import { VisibilityState } from '@tanstack/react-table';

const _columnsVisibilityKey = 'columns-visibility-state';

type PageWithColumns = 'orders';

export const useLocalStorage = () => {
  const _getItem = (itemKey: string) => {
    const item = localStorage.getItem(itemKey);
    return item ? JSON.parse(item) : null;
  };

  const _setItem = (itemKey: string, itemValue: unknown) => {
    localStorage.setItem(itemKey, JSON.stringify(itemValue));
  };

  const getColumnsFromLS = (listType: PageWithColumns) => {
    const columnsVisibility = _getItem(_columnsVisibilityKey);

    return columnsVisibility ? columnsVisibility[listType] : undefined;
  };

  const setColumnsInLS = (pageName: PageWithColumns, columnsVisibility: VisibilityState) => {
    const columnsVisibilityForPages = _getItem(_columnsVisibilityKey);
    let newColumnsVisibilityForPages;

    if (columnsVisibilityForPages) {
      newColumnsVisibilityForPages = {
        ...columnsVisibilityForPages,
        [pageName]: { ...columnsVisibility },
      };
    } else {
      newColumnsVisibilityForPages = { [pageName]: columnsVisibility };
    }

    _setItem(_columnsVisibilityKey, newColumnsVisibilityForPages);
  };

  return { getColumnsFromLS, setColumnsInLS };
};

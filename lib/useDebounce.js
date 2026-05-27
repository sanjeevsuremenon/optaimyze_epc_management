import { useState, useEffect } from "react";

const useDebounce = (value, delay) => {
  const [debouncedvalue, setDebouncedvalue] = useState(value);

  useEffect(() => {
    const timeoutID = setTimeout(() => {
      setDebouncedvalue(value);
    }, delay);

    return () => clearTimeout(timeoutID);
  }, [value, delay]);

  return debouncedvalue;
};

export default useDebounce;

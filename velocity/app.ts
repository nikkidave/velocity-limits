import * as fs from 'fs';
import * as rl from 'readline';
import { isSameDay, isSameWeek, parseISO } from 'date-fns';

const readStream = fs.createReadStream('input.txt');
const writeStream = fs.createWriteStream('output.txt');

const file = rl.createInterface({
  input: readStream,
  output: writeStream,
  terminal: false,
});

interface CustomerPayload {
  id: string;
  customer_id: string;
  load_amount: string;
  time: string;
}

interface DataStore {
  [key: string]: CustomerPayload[];
}

const getAmount = (amountString: string): number => {
  return parseFloat(amountString.slice(1));
};

let data: DataStore = {};
/*
* Description: isValidLoad returns true if
* incomingLoad <= $5,000 can be loaded per day
* incomingLoad <= $20,000 can be loaded per week
* maximum loads <= 3
*
*/
const isValidLoad = (incomingLoad: CustomerPayload): boolean => {
  const existingCustomerData = data[incomingLoad.customer_id];
  const isValidMaxPerDay = (): boolean => {
    return (
      existingCustomerData.every((loadData: CustomerPayload) => {
        return (
          existingCustomerData
            .filter((customerData: CustomerPayload) =>
              isSameDay(parseISO(customerData.time), parseISO(loadData.time))
            )
            .reduce((acc: number, filteredData: CustomerPayload) => {
              acc += getAmount(filteredData.load_amount);
              return acc;
            }, 0) <= 5000
        );
      })
    );
  };

  const isValidMaxPerWeek = (): boolean => {
    return existingCustomerData.every((loadData: CustomerPayload) => {
      return (
        existingCustomerData
          .filter((customerData: CustomerPayload) =>
            isSameWeek(parseISO(customerData.time), parseISO(loadData.time))
          )
          .reduce((acc: number, filteredData: CustomerPayload) => {
            acc += getAmount(filteredData.load_amount);
            return acc;
          }, 0) <= 20000
      );
    });
  };

  const isValidMaxLoads = (): boolean => {
    return existingCustomerData.every((loadData: CustomerPayload) => {
      return (
        existingCustomerData.filter((customerData: CustomerPayload) =>
          isSameDay(parseISO(customerData.time), parseISO(loadData.time))
        ).length <= 3
      );
    });
  };

  return isValidMaxPerDay() && isValidMaxPerWeek() && isValidMaxLoads();
};

file.on('line', (line) => {
  const newLineData = JSON.parse(line);
  const existingCustomerData = data[newLineData.customer_id];
  
  if (!existingCustomerData) {
    data[newLineData.customer_id] = [newLineData];
    //Write to a text file
    writeStream.write(
      JSON.stringify({
        id: newLineData.id,
        customer_id: newLineData.customer_id,
        accepted: isValidLoad(newLineData),
      }) + '\r\n'
    );
  } else if (
    //Check if a load id is observed more than once for a particular user
    !existingCustomerData.some(
      (loadData: CustomerPayload) => loadData.id === newLineData.id
    )
  ) {
    data[newLineData.customer_id] = [...existingCustomerData, newLineData];
    //Write to a text file
    writeStream.write(
      JSON.stringify({
        id: newLineData.id,
        customer_id: newLineData.customer_id,
        accepted: isValidLoad(newLineData),
      }) + '\r\n'
    );
  }
});

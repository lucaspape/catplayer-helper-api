package main

import (
	"fmt"
	"strings"
  "os"
  "bufio"
  "log"
)

func CompareTwoStrings(stringOne, stringTwo string) float64 {
	removeSpaces(&stringOne, &stringTwo)

	if value := returnEarlyIfPossible(stringOne, stringTwo); value >= 0 {
		return value
	}

	firstBigrams := make(map[string]int)
	for i := 0; i < len(stringOne)-1; i++ {
		a := fmt.Sprintf("%c", stringOne[i])
		b := fmt.Sprintf("%c", stringOne[i+1])

		bigram := a + b

		var count int

		if value, ok := firstBigrams[bigram]; ok {
			count = value + 1
		} else {
			count = 1
		}

		firstBigrams[bigram] = count
	}

	var intersectionSize float64
	intersectionSize = 0

	for i := 0; i < len(stringTwo)-1; i++ {
		a := fmt.Sprintf("%c", stringTwo[i])
		b := fmt.Sprintf("%c", stringTwo[i+1])

		bigram := a + b

		var count int

		if value, ok := firstBigrams[bigram]; ok {
			count = value
		} else {
			count = 0
		}

		if count > 0 {
			firstBigrams[bigram] = count - 1
			intersectionSize = intersectionSize + 1
		}
	}

	return (2.0 * intersectionSize) / (float64(len(stringOne)) + float64(len(stringTwo)) - 2)
}

func removeSpaces(stringOne, stringTwo *string) {
	*stringOne = strings.Replace(*stringOne, " ", "", -1)
	*stringTwo = strings.Replace(*stringTwo, " ", "", -1)
}

func returnEarlyIfPossible(stringOne, stringTwo string) float64 {
	// if both are empty strings
	if len(stringOne) == 0 && len(stringTwo) == 0 {
		return 1
	}

	// if only one is empty string
	if len(stringOne) == 0 || len(stringTwo) == 0 {
		return 0
	}

	// identical
	if stringOne == stringTwo {
		return 1
	}

	// both are 1-letter strings
	if len(stringOne) == 1 && len(stringTwo) == 1 {
		return 0
	}

	// if either is a 1-letter string
	if len(stringOne) < 2 || len(stringTwo) < 2 {
		return 0
	}

	return -1
}

func countFileLines(filename string) int {
  var lines int = 0;

  file, err := os.Open(filename)
    if err != nil {
        log.Fatal(err)
    }
    defer file.Close()

    scanner := bufio.NewScanner(file)
    for scanner.Scan() {
        lines++
    }

    if err := scanner.Err(); err != nil {
        log.Fatal(err)
    }

  return lines
}

func BubbleSort(list []float64, secondaryList []string)[]string{
  var n int = len(list)
  var t float64
  var c,d int
  var f string

  for c = 0 ; c < n - 1; c++ {
    for d = 0 ; d < n - c - 1; d++ {
      if list[d] < list[d+1] {
        /* Swapping */
        t         = list[d];
        list[d]   = list[d+1];
        list[d+1] = t;

        f                  = secondaryList[d];
        secondaryList[d]   = secondaryList[d+1];
        secondaryList[d+1] = f;
      }
    }
  }

  return secondaryList;
}

func CompareFromFile(filename, inputString string){
  var totalLines int = countFileLines(filename)

  var distances = make([]float64,totalLines)
  var lines = make([]string,totalLines)

  file, err := os.Open(filename)
    if err != nil {
        log.Fatal(err)
    }
    defer file.Close()

    var lineCount int = 0

    scanner := bufio.NewScanner(file)
    for scanner.Scan() {
        lines[lineCount] = scanner.Text()
        distances[lineCount] = CompareTwoStrings(scanner.Text(), inputString)

        lineCount++
    }

    var sorted []string = BubbleSort(distances, lines)

    for i:=0; i < len(sorted); i++{
      fmt.Println(sorted[i])
    }

    if err := scanner.Err(); err != nil {
        log.Fatal(err)
    }
}

func main() {
    CompareFromFile(os.Args[1], os.Args[2])
}

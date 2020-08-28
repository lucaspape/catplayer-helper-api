package main

import (
	"fmt"
	"strings"
  "os"
  "bufio"
  "log"
  "strconv"
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

func BubbleSort(list []float64, idList []string, searchStringList []string)([]string, []string){
  var n int = len(list)
  var t float64
  var c,d int
  var f,g string

  for c = 0 ; c < n - 1; c++ {
    for d = 0 ; d < n - c - 1; d++ {
      if list[d] < list[d+1] {
        /* Swapping */
        t         = list[d];
        list[d]   = list[d+1];
        list[d+1] = t;

        f                  = idList[d];
        idList[d]   = idList[d+1];
        idList[d+1] = f;

				g                  = searchStringList[d];
        searchStringList[d]   = searchStringList[d+1];
        searchStringList[d+1] = g;
      }
    }
  }

  return idList, searchStringList;
}

func CompareFromFile(filename string, idFile string, inputString string, totalLines int, skip int, limit int)([]float64, []string){
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
        distances[lineCount] = CompareTwoStrings(scanner.Text(), inputString)
				lines[lineCount] = scanner.Text()

        lineCount++
    }

    if err := scanner.Err(); err != nil {
        log.Fatal(err)
    }

		return distances, lines
}

func main() {
		var filename = os.Args[1]
		var idFilename = os.Args[2]
		var excludeIds = os.Args[4]

    skip, err := strconv.Atoi(os.Args[5])
    if err != nil {
        // handle error
        fmt.Println(err)
        os.Exit(2)
    }
    limit, err := strconv.Atoi(os.Args[6])
    if err != nil {
        // handle error
        fmt.Println(err)
        os.Exit(2)
    }

		var totalLines int = countFileLines(os.Args[1])

		var distances = make([]float64,totalLines)
		var searchLines = make([]string,totalLines)

		inputStrings := strings.Split(os.Args[3], ",")

		for k:=0; k < len(inputStrings); k++{
			if k==0{
				distances,searchLines = CompareFromFile(filename, idFilename, inputStrings[k], totalLines, skip, limit)
			}else{
				newDistances,newSearchLines := CompareFromFile(filename, idFilename, inputStrings[k], totalLines, skip, limit)

				for j:=0; j<len(newDistances); j++{
					distances[j] = distances[j] + newDistances[j]
				}

				searchLines = newSearchLines
			}
		}

		var lines = make([]string,totalLines)

		var lineCount int = 0

		idFile, err := os.Open(idFilename)
		if err != nil {
        log.Fatal(err)
    }
    defer idFile.Close()

		scanner := bufio.NewScanner(idFile)
    for scanner.Scan() {
        lines[lineCount] = scanner.Text()
        lineCount++
    }

    ids,searchStrings := BubbleSort(distances, lines, searchLines)

    var count int = 0
		var skipMC bool = strings.Contains(excludeIds, "monstercat")

    for i:=skip; i < len(ids); i++{
      if count >= limit{
        break
      }

			if strings.Contains(excludeIds, ids[i]){
				limit++
				count++
			}else if (skipMC && strings.Contains(searchStrings[i], "monstercat")){
				limit++
				count++
			}else{
				fmt.Println(ids[i])
	      count++
			}
    }
}

#include <string.h>
#include <stdio.h>
#include <stdlib.h>
#include <ctype.h>

#define MAX(x, y) (((x) > (y)) ? (x) : (y))
#define MIN(x, y) (((x) < (y)) ? (x) : (y))

char *strtolower(char *s)
{
    char *d = (char *)malloc(strlen(s));
    while (*s)
    {
        *d =tolower(*s);
        d++;
        s++;
    }
    return d;
}

int editDistance(char * s1, char * s2){
  s1 = strtolower(s1);
  s2 = strtolower(s2);

  int costs[strlen(s2)];

  for(int i=0; i<= strlen(s1); i++){
    int lastValue = i;

    for(int j=0; j<= strlen(s2); j++){
      if(i==0)
        costs[j] = j;
      else {
        if(j > 0){
          int newValue = costs[j - 1];
          if(s1[i-1] != s2[j-1])
            newValue = MIN(MIN(newValue, lastValue), costs[j]) + 1;
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if(i > 0)
      costs[strlen(s2)] = lastValue;
  }

  return costs[strlen(s2)];
}

double similarity(char * s1, char * s2){
  char * longer = s1;
  char * shorter = s2;

  if(strlen(s1) < strlen(s2)){
    longer = s2;
    shorter = s1;
  }

  int longerLength = strlen(longer);

  if(longerLength == 0){
    return 1.0;
  }

  return ((longerLength - editDistance(longer, shorter)) / (double)(longerLength)) * 100.0;
}

int linesInFile(char * filename){
  FILE * fp;
  char * line = NULL;
  size_t len = 0;
  ssize_t read;
  size_t lineCount = 0;

  fp = fopen(filename, "r");
  if(fp == NULL)
      exit(EXIT_FAILURE);

  while((read = getline(&line, &len, fp)) != -1){
      lineCount++;
  }

  fclose(fp);
  if(line)
    free(line);

  return lineCount;
}

char **bubble_sort(long list[], long n, char * secondaryList[])
{
  long c, d, t;
  char * f;

  for (c = 0 ; c < n - 1; c++) {
    for (d = 0 ; d < n - c - 1; d++) {
      if (list[d] < list[d+1]) {
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

char * compareStrings(char * inputFile, char * inputString)
{
    long totalLines = linesInFile(inputFile);

    long distances[totalLines];
    char *lines[totalLines];

    FILE * fp;
    char * line = NULL;
    size_t len = 0;
    ssize_t read;

    fp = fopen(inputFile, "r");
    if(fp == NULL)
        exit(EXIT_FAILURE);

    long lineCount = 0;

    for(long i=0; i<totalLines; i++){
      lines[i] = NULL;
      getline(&lines[i], &len, fp);
    }

    for(long i=0; i<totalLines; i++){
      distances[i] = similarity(lines[i], inputString);
    }

    char ** sort = bubble_sort(distances, totalLines, lines);

    long i = 0;

    do {
      printf("%s", sort[i]);
      i++;
    } while(i<totalLines);

    fclose(fp);
    if(line)
      free(line);

    return "";
}

int main(int argc, char *argv[])
{
    if(argc == 3){
      compareStrings(argv[1], argv[2]);
    }else if(argc > 3){
      printf("Too many arguments \n");
    }else{
      printf("Not enough arguments \n");
    }

    return 0;
}

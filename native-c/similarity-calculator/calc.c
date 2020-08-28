#include <string.h>
#include <stdio.h>
#include <stdlib.h>
#include <ctype.h>

#define MAX(x, y) (((x) > (y)) ? (x) : (y))
#define MIN(x, y) (((x) < (y)) ? (x) : (y))

char * charToLower(const char *s){
  char * lower;
  lower = malloc(strlen(s));

  for(int i=0; i<strlen(s); i++){
    lower[i] = tolower(s[i]);
  }

  return lower;
}

int editDistance (const char * word1,

                     const char * word2
                    )
{
  char * s1 = charToLower(word1);
  char * s2 = charToLower(word2);

  int len1 = strlen(s1);
  int len2 = strlen(s2);

    int matrix[len1 + 1][len2 + 1];
    int i;
    for (i = 0; i <= len1; i++) {
        matrix[i][0] = i;
    }
    for (i = 0; i <= len2; i++) {
        matrix[0][i] = i;
    }
    for (i = 1; i <= len1; i++) {
        int j;
        char c1;

        c1 = word1[i-1];
        for (j = 1; j <= len2; j++) {
            char c2;

            c2 = word2[j-1];
            if (c1 == c2) {
                matrix[i][j] = matrix[i-1][j-1];
            }
            else {
                int delete;
                int insert;
                int substitute;
                int minimum;

                delete = matrix[i-1][j] + 1;
                insert = matrix[i][j-1] + 1;
                substitute = matrix[i-1][j-1] + 1;
                minimum = delete;
                if (insert < minimum) {
                    minimum = insert;
                }
                if (substitute < minimum) {
                    minimum = substitute;
                }
                matrix[i][j] = minimum;
            }
        }
    }
    return matrix[len1][len2];
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

  return ((double)(longerLength - editDistance(longer, shorter)) / (double)(longerLength)) * 100.0;
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

double *bubble_sort(double list[], long n, char * secondaryList[])
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

  return list;
}

char * compareStrings(char * inputFile, char * inputString)
{
    long totalLines = linesInFile(inputFile);

    double distances[totalLines];
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
      printf("%l", similarity(lines[i], inputString));
      distances[i] = similarity(lines[i], inputString);
    }

    double * sort = bubble_sort(distances, totalLines, lines);

    long i = 0;

    do {
      printf("%lf\n", sort[i]);
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



import matplotlib.pyplot as plt
import pandas as pd



def graph_plot():

    filename = input("filename: ")
    data = pd.read_csv("testing_results/"+filename)

    rf = data['signal_strength']
    direction = data['cardinal_direction']

    ax = plt.subplot(111, projection='polar')
    ax.plot(direction, rf)
    ax.set_rmax(150)  #Setting this arbitrary, should fit all rf reads
    
    plt.savefig('testing_plots/'+filename+'.png')
    plt.close()




if __name__ == '__main__':
    graph_plot()